<?php

class IsepOr_Model extends Model {
    
    public function fetchQuestions() {
        $questions = DB::select('
			SELECT id, questions, type, extra
			FROM isepdor_questions
                        ORDER BY position ASC;');
        
        return $questions;
    }
    
    public function fetchQuestionsExtra() {
        $questions = DB::select('
			SELECT id, questions, type, extra
			FROM isepdor_questions_extra
                        ORDER BY position ASC;');
        
        return $questions;
    }
    
    public function fetchFinals($id, $type, $step = 1, $extra = false) {

        switch ($type) {
                    case 'events':
                        $questions = DB::select('
                            SELECT s.name as name, s.id as valid, COUNT( * ) AS cmpt, \'events\' AS tableName
                            FROM isepdor_round'.(int) $step.' r
                            INNER JOIN isepdor_event s ON r.isepdor_event_id = s.id
                            WHERE r.isepdor_questions_id = :id
                            '.(($extra) ? 'AND r.extra = 1': 'AND r.extra = 0').'
                            GROUP BY r.isepdor_event_id
                            ORDER BY cmpt DESC
                            LIMIT 0,3;
                        ', array(
                            'id' => (int) $id
                        ));
                        return $questions;
                        break;
                    case 'students':
                        $questions = DB::select('
                            SELECT s.username as valid, CONCAT(s.firstname," ",s.lastname) as name, COUNT( * ) AS cmpt, \'students\' AS tableName
                            FROM isepdor_round'.(int) $step.' r
                            INNER JOIN students s ON r.student_username = s.username
                            WHERE r.isepdor_questions_id = :id
                            '.(($extra) ? 'AND r.extra = 1': 'AND r.extra = 0').'
                            GROUP BY r.student_username
                            ORDER BY cmpt DESC
                            LIMIT 0,3;
                        ', array(
                            'id' => (int) $id
                        ));
                        return $questions;
                        break;
                    case 'employees':
                         $questions = DB::select('
                            SELECT s.id as valid, CONCAT(s.firstname," ",s.lastname) as name, COUNT( * ) AS cmpt, \'employees\' AS tableName
                            FROM isepdor_round'.(int) $step.' r
                            INNER JOIN isepdor_employees s ON r.isepdor_employees_id = s.id
                            WHERE r.isepdor_questions_id = :id
                            '.(($extra) ? 'AND r.extra = 1': 'AND r.extra = 0').'
                            GROUP BY r.isepdor_employees_id
                            ORDER BY cmpt DESC
                            LIMIT 0,3;
                        ', array(
                            'id' => (int) $id
                        ));
                        return $questions;
                        break;
                    case 'associations':
                         $questions = DB::select('
                            SELECT s.name as name, s.id as valid, COUNT( * ) AS cmpt, \'associations\' AS tableName
                            FROM isepdor_round'.(int) $step.' r
                            INNER JOIN isepdor_associations s ON r.isepdor_associations_id = s.id
                            WHERE r.isepdor_questions_id = :id
                            '.(($extra) ? 'AND r.extra = 1': 'AND r.extra = 0').'
                            GROUP BY r.isepdor_associations_id
                            ORDER BY cmpt DESC
                            LIMIT 0,3;
                        ', array(
                            'id' => (int) $id
                        ));
                         return $questions;
                        break;
                    default:
                        throw new Exception('Error, Please try again.'.$type);
                        break;
        }
    }
    
    public function countUser($extra = false){
        
        $questions = DB::select('
                        SELECT COUNT( * ) AS `Lignes` , `s`.`isepdor_questions_id`
                        FROM `isepdor_round2` s
                        '.(($extra) ? 'WHERE s.extra = 1': 'WHERE s.extra = 0').'
                        GROUP BY s.`isepdor_questions_id`
                        ORDER BY s.`isepdor_questions_id`;
                        ');
        
        return $questions;

    }
    
    public function searchUsers($query, $limit, $promo = null) {
        if(strpos(',', $promo))
            $promo = implode (', ', Search_Model::sanitize($promo));
        else if(!empty($promo))
           $promo = (int) Search_Model::sanitize($promo);
        else{
            for($i = 0; $i < 5; $i++)
                $promo[] = date('Y')+$i;
            $promo = implode (', ', $promo);
        }
        $students = DB::select('
			SELECT s.username AS valid, CONCAT(s.firstname," ",s.lastname) AS shows, \'students\' AS tableName
			FROM students s
                        WHERE CONCAT(s.firstname," ",s.lastname) LIKE "'.Search_Model::sanitize($query).'%"
			AND promo IN ('.$promo.')
                        ORDER BY s.promo ASC
                        LIMIT 0,'.$limit.';');
        
        return $students;
    }
    
     public function searchEvents($query, $limit, $extra = null) {

        $students = DB::select('
			SELECT id AS valid, name AS shows, \'events\' AS tableName
			FROM isepdor_event
                        WHERE name LIKE "'.Search_Model::sanitize($query).'%"
                       '.(!empty($extra) ? 'AND extra = "'.Search_Model::sanitize($extra).'"' : '').'
                        ORDER BY isepdor_event.id ASC
                        LIMIT 0,'.$limit.';');
        
        return $students;
    }
    
    public function searchAssociations($query, $limit, $extra = null) {

        $students = DB::select('
			SELECT id AS valid, name AS shows, \'associations\' AS tableName
			FROM isepdor_associations
                        WHERE name LIKE "'.Search_Model::sanitize($query).'%"
                       '.(!empty($extra) ? 'AND extra = "'.Search_Model::sanitize($extra).'"' : '').'
                        ORDER BY isepdor_associations.id ASC
                        LIMIT 0,'.$limit.';');
        
        return $students;
    }
    
    public function searchEmployees($query, $limit, $extra = null) {

        $students = DB::select('
			SELECT s.id AS valid, CONCAT(s.firstname," ",s.lastname) AS shows, \'employees\' AS tableName
			FROM isepdor_employees s
                        WHERE CONCAT(s.firstname," ",s.lastname) LIKE "%'.Search_Model::sanitize($query).'%"
                       '.(!empty($extra) ? 'AND extra = "'.Search_Model::sanitize($extra).'"' : '').'
                        ORDER BY s.id ASC
                        LIMIT 0,'.$limit.';');
        
        return $students;
    }
    
    public function checkVote($user_id, $step = 1){
        $students = DB::execute('
			SELECT id
                        FROM isepdor_round'.(int) $step.'
                        WHERE `voting_user_id` = '.(int) $user_id.'
                        ');
        
        return $students->rowCount();
    }
    
    public function save($data, $step){
        
        $sql = array();
        $has_extra = false;
        foreach ($data as $key => $value){
            if (!empty($value)) {
                $new_key = preg_replace('#valid-#', '', $key);
                if (preg_match('`^(events|students|employees|associations)-([0-9]*)(?:-(extra))?$`', $new_key, $matches)) {
                    if(!empty($matches[3]) && $matches[3] == 'extra')
                        $has_extra = true;
                    switch ($matches[1]) {
                        case 'events':
                            $sql[] = '(' . (int) $matches[2] . ',' . User_Model::$auth_data['id'] . ', NULL, NULL, NULL, ' . (int) $value . ', ' . (($has_extra) ? '1' : '0') . ')';
                            break;
                        case 'students':
                            $sql[] = '(' . (int) $matches[2] . ',' . User_Model::$auth_data['id'] . ', "' . Search_Model::sanitize($value) . '", NULL, NULL, NULL, ' . (($has_extra) ? '1' : '0') . ')';
                            break;
                        case 'employees':
                            $sql[] = '(' . (int) $matches[2] . ',' . User_Model::$auth_data['id'] . ', NULL, ' . (int) $value . ', NULL, NULL, ' . (($has_extra) ? '1' : '0') . ')';
                            break;
                        case 'associations':
                            $sql[] = '(' . (int) $matches[2] . ',' . User_Model::$auth_data['id'] . ', NULL, NULL, ' . (int) $value . ', NULL, ' . (($has_extra) ? '1' : '0') . ')';
                            break;
                        default:
                            throw new Exception('Error, Please try again.');
                            break;
                    }
                }
            } else {
                throw new Exception('Error, Please try again.');
            }
        }
        $data = DB::execute('
                    INSERT INTO `isepdor_round'.(int) $step.'` (`isepdor_questions_id`, `voting_user_id`, `student_username`, `isepdor_employees_id`, `isepdor_associations_id`, `isepdor_event_id`, `extra`) VALUES
                    '.implode(',',$sql).';
                        
            ');
    }
}

?>
