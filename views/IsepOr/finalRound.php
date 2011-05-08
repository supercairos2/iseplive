<?php if($empty_post): ?>
<div id="isepor">
    <h1><?php echo __('ISEPOR_TITLE'); ?></h1>
    <p style="width: 500px;  margin-bottom: 20px;">
        <?php echo __('ISEPOR_TEXT'); ?>
    </p>
    <form method="post" action="http://localhost/iseplive/app/isep-d-or/final" id="form-isepor-final" >
    <?php foreach($questions as $question): ?>
        <div id="question-<?php echo $question['id'] ?>">
            <h2><?php echo htmlspecialchars($question['questions']) ?> :</h2>
            <p style="margin: 5px;" itemid="<?php echo $question['id'] ?>"  class="valid">
            <?php foreach($datas[$question['id']] as $key => $data): ?>
                <input type="radio" name="valid-<?php echo htmlspecialchars($data['tableName']); ?>-<?php echo $question['id'] ?>" value="<?php echo $data['valid']; ?>" id="radio-<?php echo $question['id'] ?>-<?php echo $key; ?>" />
                <label for="radio-<?php echo $question['id'] ?>-<?php echo $key; ?>"><?php echo $data['name'] ?></label>
                <br />
            <?php endforeach; ?>
                <span id="question-<?php echo $question['id'] ?>-error-emp" class="emptyError hidden"><?php echo __('ISEPOR_ERROR_EMPTY'); ?></span>
            </p>
        </div>
    <?php endforeach; ?>
        <div class="submit">
            <input type="submit" value="Envoyer !"/>
        </div>
    </form>
</div>
<?php else : ?>
<div >
    <h1><?php echo __('ISEPOR_VOTE_OK'); ?></h1>
    <p style="margin: 0 auto; width: 260px;" >
        <img src="<?php echo Config::URL_STATIC; ?>images/others/ok.png" alt="Vote Ok !" /><br />
        <a href="<?php echo Config::URL_ABSOLUTE; ?>"><?php echo __('ISEPOR_BACK_HOME'); ?></a>
    </p>
</div>
<?php endif; ?>
