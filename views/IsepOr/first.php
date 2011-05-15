<?php if($empty_post): ?>
<div id="isepor">
    <h1><?php echo __('ISEPOR_TITLE'); ?></h1>
    <form method="post" action="http://localhost/iseplive/app/isep-d-or" id="form-isepor-first" >
    <?php foreach($questions as $question): ?>
        <div id="question-<?php echo $question['id'] ?>">
            <h2><label for="question-<?php echo $question['id'] ?>-input"><?php echo $question['questions'] ?> :</label></h2>
            <p itemid="<?php echo $question['id'] ?>">
                <input type="hidden" value="<?php echo $question['type']; ?>" id="question-<?php echo $question['id'] ?>-type" />
                <input type="hidden" value="<?php echo $question['extra']; ?>" id="question-<?php echo $question['id'] ?>-extra" />
                <input type="text" id="question-<?php echo $question['id']; ?>-input" class="autocomplete" style="margin: 5px;"/>
                <span id="question-<?php echo $question['id'] ?>-error-com" class="error hidden" ><?php echo __('ISEPOR_ERROR_AUTOCOMPLETE'); ?></span>
                <span id="question-<?php echo $question['id'] ?>-error-nan" class="error hidden" ><?php echo __('ISEPOR_ERROR_NOT_EXIST'); ?></span>
                <span id="question-<?php echo $question['id'] ?>-error-emp" class="error hidden" ><?php echo __('ISEPOR_ERROR_EMPTY'); ?></span>
                <input class="valid" type="hidden" name="valid-<?php echo $question['id'] ?>" id="question-<?php echo $question['id'] ?>-valid" value="" />
            </p>
        </div>
    <?php endforeach; ?>
        <div class="submit">
            <input type="submit" value="Envoyer !"/>
        </div>
    </form>
</div>
<?php endif; ?>